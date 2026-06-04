"use client";

import { createAuthClient } from "better-auth/react";

export function createPrismAuthClient(baseURL?: string) {
  return createAuthClient({
    baseURL: baseURL ?? "",
  });
}
