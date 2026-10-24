export const mergeSnippetUpdate = (existingSnippet, updatedSnippet) => {
  const { user_id, forked_from, ...safeUpdatedFields } = updatedSnippet;
  return { ...existingSnippet, ...safeUpdatedFields };
};
