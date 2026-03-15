/**
 * Publish Validation Engine
 * 
 * Every entity must pass validation before being considered publishable.
 * This runs checks against the entity contract and produces a publish score.
 */

import type { Product, ProductOption, Host, Destination, Area } from "@/hooks/useProducts";

export interface ValidationCheck {
  field: string;
  rule: string;
  passed: boolean;
  severity: "error" | "warning" | "info";
  message: string;
}

export interface PublishValidationResult {
  entity_type: string;
  entity_id: string;
  publish_score: number;
  is_publishable: boolean;
  checks: ValidationCheck[];
}

// ============ PRODUCT VALIDATION ============
export const validateProduct = (
  product: Product,
  options: ProductOption[],
  hosts: Host[],
  destination?: Destination | null,
): PublishValidationResult => {
  const checks: ValidationCheck[] = [];

  // Required fields
  checks.push({
    field: "title",
    rule: "non_empty",
    passed: !!product.title?.trim(),
    severity: "error",
    message: product.title ? "Title present" : "Title is required",
  });

  checks.push({
    field: "slug",
    rule: "non_empty",
    passed: !!product.slug?.trim(),
    severity: "error",
    message: product.slug ? "Slug present" : "Slug is required",
  });

  checks.push({
    field: "description",
    rule: "min_length_50",
    passed: (product.description?.length || 0) >= 50,
    severity: "warning",
    message: (product.description?.length || 0) >= 50 ? "Description adequate" : "Description should be at least 50 characters",
  });

  checks.push({
    field: "cover_image",
    rule: "non_empty",
    passed: !!product.cover_image?.trim(),
    severity: "error",
    message: product.cover_image ? "Cover image present" : "Cover image is required",
  });

  checks.push({
    field: "destination",
    rule: "linked",
    passed: !!product.destination_id,
    severity: "error",
    message: product.destination_id ? "Destination linked" : "Product must be linked to a destination",
  });

  checks.push({
    field: "activity_type",
    rule: "linked",
    passed: !!product.activity_type_id,
    severity: "warning",
    message: product.activity_type_id ? "Activity type linked" : "Activity type should be assigned",
  });

  // Options and pricing
  checks.push({
    field: "options",
    rule: "min_count_1",
    passed: options.length >= 1,
    severity: "error",
    message: options.length >= 1 ? `${options.length} option(s) defined` : "At least one option is required",
  });

  const hasPrice = options.some(o => o.price_options.length > 0);
  checks.push({
    field: "pricing",
    rule: "has_price",
    passed: hasPrice,
    severity: "warning",
    message: hasPrice ? "Pricing defined" : "At least one price option recommended",
  });

  // Hosts
  checks.push({
    field: "hosts",
    rule: "min_count_1",
    passed: hosts.length >= 1,
    severity: "warning",
    message: hosts.length >= 1 ? `${hosts.length} host(s) linked` : "At least one host recommended",
  });

  // Location
  checks.push({
    field: "location",
    rule: "has_coordinates",
    passed: !!(product.latitude && product.longitude),
    severity: "info",
    message: product.latitude ? "Coordinates present" : "Coordinates improve map visibility",
  });

  // Gallery
  const galleryCount = product.gallery?.length || 0;
  checks.push({
    field: "gallery",
    rule: "min_count_3",
    passed: galleryCount >= 3,
    severity: "info",
    message: galleryCount >= 3 ? `${galleryCount} gallery images` : "3+ gallery images recommended",
  });

  // Calculate score
  const errorCount = checks.filter(c => !c.passed && c.severity === "error").length;
  const warningCount = checks.filter(c => !c.passed && c.severity === "warning").length;
  const totalChecks = checks.length;
  const passedChecks = checks.filter(c => c.passed).length;
  const score = Math.round((passedChecks / totalChecks) * 100);

  return {
    entity_type: "product",
    entity_id: product.id,
    publish_score: score,
    is_publishable: errorCount === 0,
    checks,
  };
};

// ============ DESTINATION VALIDATION ============
export const validateDestination = (
  destination: Destination,
  productCount: number,
): PublishValidationResult => {
  const checks: ValidationCheck[] = [];

  checks.push({ field: "name", rule: "non_empty", passed: !!destination.name, severity: "error", message: destination.name ? "Name present" : "Name required" });
  checks.push({ field: "slug", rule: "non_empty", passed: !!destination.slug, severity: "error", message: destination.slug ? "Slug present" : "Slug required" });
  checks.push({ field: "description", rule: "min_length_50", passed: (destination.description?.length || 0) >= 50, severity: "warning", message: "Description check" });
  checks.push({ field: "products", rule: "min_count_5", passed: productCount >= 5, severity: "warning", message: productCount >= 5 ? `${productCount} products` : "5+ products recommended for destination hub" });
  checks.push({ field: "cover_image", rule: "non_empty", passed: !!destination.cover_image, severity: "warning", message: "Cover image check" });

  const errorCount = checks.filter(c => !c.passed && c.severity === "error").length;
  const score = Math.round((checks.filter(c => c.passed).length / checks.length) * 100);

  return {
    entity_type: "destination",
    entity_id: destination.id,
    publish_score: score,
    is_publishable: errorCount === 0,
    checks,
  };
};

// ============ HOST VALIDATION ============
export const validateHost = (host: Host): PublishValidationResult => {
  const checks: ValidationCheck[] = [];

  checks.push({ field: "display_name", rule: "non_empty", passed: !!host.display_name, severity: "error", message: "Display name check" });
  checks.push({ field: "slug", rule: "non_empty", passed: !!host.slug, severity: "error", message: "Slug check" });
  checks.push({ field: "bio", rule: "min_length_20", passed: (host.bio?.length || 0) >= 20, severity: "warning", message: "Bio check" });
  checks.push({ field: "avatar", rule: "non_empty", passed: !!host.avatar_url, severity: "info", message: "Avatar check" });

  const errorCount = checks.filter(c => !c.passed && c.severity === "error").length;
  const score = Math.round((checks.filter(c => c.passed).length / checks.length) * 100);

  return { entity_type: "host", entity_id: host.id, publish_score: score, is_publishable: errorCount === 0, checks };
};
