// TODO: Extend this type when Swagger documents additional cursor pagination metadata.
export type CursorPage<Item> = {
  readonly items: readonly Item[];
  readonly nextCursor?: string | null;
};
