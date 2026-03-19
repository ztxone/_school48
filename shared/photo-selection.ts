export function normalizeLastName(value: string) {
  return value
    .normalize('NFC')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('ru-RU')
    .replace(/ё/g, 'е')
}
