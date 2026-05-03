import * as React from "react"

const MOBILE_BREAKPOINT = 768
const DESKTOP_BREAKPOINT = 1024

const getIsMobile = () => {
  if (typeof window === "undefined") return false
  return window.innerWidth < MOBILE_BREAKPOINT
}

const getIsBelowDesktop = () => {
  if (typeof window === "undefined") return false
  return window.innerWidth < DESKTOP_BREAKPOINT
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(getIsMobile)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => setIsMobile(getIsMobile())
    mql.addEventListener("change", onChange)
    setIsMobile(getIsMobile())
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}

/** True for phones AND tablets — i.e. anything below the desktop breakpoint.
 *  Use this for layouts that should drop the sidebar/desktop chrome on tablet. */
export function useIsBelowDesktop() {
  const [v, setV] = React.useState<boolean>(getIsBelowDesktop)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${DESKTOP_BREAKPOINT - 1}px)`)
    const onChange = () => setV(getIsBelowDesktop())
    mql.addEventListener("change", onChange)
    setV(getIsBelowDesktop())
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return v
}
