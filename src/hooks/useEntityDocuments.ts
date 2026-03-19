/**
 * Runtime consumption hooks for entity documents.
 * Used by search, recommendation, and LLM services.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EntityDocument {
  id: string;
  entity_type: string;
  entity_id: string;
  document_type: string;
  document_json: any;
  version: number;
  generated_at: string;
  generation_status: string;
  source_hash: string;
}

export const useEntityDocument = (
  entityType: string,
  entityId: string,
  documentType: string,
) => {
  return useQuery({
    queryKey: ["entity-doc", entityType, entityId, documentType],
    queryFn: async (): Promise<EntityDocument | null> => {
      const { data, error } = await (supabase as any)
        .from("entity_documents")
        .select("*")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .eq("document_type", documentType)
        .maybeSingle();
      if (error) return null;
      return data as EntityDocument | null;
    },
    enabled: !!entityId && !!documentType,
    staleTime: 2 * 60 * 1000,
  });
};

export const useSearchDocument = (productId: string) =>
  useEntityDocument("product", productId, "search_document");

export const useLlmGrounding = (productId: string) =>
  useEntityDocument("product", productId, "llm_grounding");

export const useJsonLd = (productId: string) =>
  useEntityDocument("product", productId, "json_ld");

export const usePublicPagePayload = (productId: string) =>
  useEntityDocument("product", productId, "public_page_payload");

/** Fetch search documents for multiple products (for search results enrichment) */
export const useSearchDocuments = (productIds: string[]) => {
  return useQuery({
    queryKey: ["search-docs-bulk", productIds],
    queryFn: async (): Promise<EntityDocument[]> => {
      if (productIds.length === 0) return [];
      const { data, error } = await (supabase as any)
        .from("entity_documents")
        .select("*")
        .eq("entity_type", "product")
        .eq("document_type", "search_document")
        .in("entity_id", productIds);
      if (error) return [];
      return (data || []) as EntityDocument[];
    },
    enabled: productIds.length > 0,
    staleTime: 2 * 60 * 1000,
  });
};

/** Fetch all LLM grounding docs for a destination (for AI chat context) */
export const useLlmGroundingByDestination = (destinationSlug: string) => {
  return useQuery({
    queryKey: ["llm-grounding-dest", destinationSlug],
    queryFn: async (): Promise<EntityDocument[]> => {
      // Get product IDs for this destination first
      const { data: products } = await supabase
        .from("products")
        .select("id")
        .eq("publish_state", "published" as any)
        .limit(200) as any;
      if (!products?.length) return [];
      
      const ids = products.map((p: any) => p.id);
      const { data, error } = await (supabase as any)
        .from("entity_documents")
        .select("*")
        .eq("entity_type", "product")
        .eq("document_type", "llm_grounding")
        .in("entity_id", ids);
      if (error) return [];
      return (data || []) as EntityDocument[];
    },
    enabled: !!destinationSlug,
    staleTime: 5 * 60 * 1000,
  });
};
