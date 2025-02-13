import { z } from "zod";

export const isValidMetadata = (metadata: Record<string, unknown>) => {
  const keys = Object.keys(metadata);
  if (keys.length > 50) {
    return false;
  }
  for (const [key, value] of Object.entries(metadata)) {
    if (key.length == 0 || key.length > 40) {
      return false;
    }
    if (key.includes("[") || key.includes("]")) {
      return false;
    }
    let stringifiedValue: string | undefined;
    try {
      stringifiedValue = JSON.stringify(value);
    } catch (e) {
      return false;
    }
    if (stringifiedValue === undefined) {
      return false;
    }
    if (stringifiedValue.length > 500) {
      return false;
    }
  }
  return true;
};

export const parseMetadata = (metadata: unknown) => {
  try {
    return z.record(z.string(), z.string()).parse(metadata);
  } catch (e) {
    return {};
  }
};

export const mergeMetadata = (metadata: unknown, newMetadata: Record<string, unknown>) => {
  let mergedMetadata: Record<string, string>;

  try {
    mergedMetadata = parseMetadata(metadata);
  } catch (e) {
    mergedMetadata = {};
  }

  if (Object.keys(newMetadata).length === 0) {
    return {};
  }

  for (const [key, value] of Object.entries(newMetadata)) {
    if (value === "") {
      delete mergedMetadata[key];
    } else {
      mergedMetadata[key] = JSON.stringify(value);
    }
  }
  return mergedMetadata;
};
