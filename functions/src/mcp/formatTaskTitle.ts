export function formatTaskTitle(
  projectIdentifier: string | undefined,
  serialNumber: number | undefined,
  customTitle: string,
): string {
  const trimmedTitle = customTitle.trim();

  if (projectIdentifier && serialNumber) {
    return `${projectIdentifier}-${serialNumber}-${trimmedTitle}`;
  }

  return trimmedTitle;
}
