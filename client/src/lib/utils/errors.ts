export function formatError(e: any): string {
  const errorMessage =
    e.data?.message ||
    (e.data?.data
      ? JSON.stringify(e.data?.data)
      : e.message
      ? e.message
      : JSON.stringify(e)); //(e.toString ? e.toString() : ;
  if (errorMessage.indexOf(' could not be found') !== -1) {
    return `node out of sync: "block ${errorMessage}"`;
  } else if (errorMessage.indexOf('No state available for block ') !== -1) {
    return `node out of sync: "${errorMessage}"`;
  }
  return errorMessage;
}
