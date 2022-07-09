export function removeIfPresent(array: {}[], obj: {}): boolean {
  const index = array.indexOf(obj);
  if (index >= 0) {
    array.splice(index, 1);
    return true;
  }
  return false;
}
