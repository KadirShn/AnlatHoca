const libraryDateFormatter = new Intl.DateTimeFormat("tr-TR", {
  dateStyle: "medium",
});

export function formatLibraryDate(value: string): string {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Tarih bilinmiyor"
    : libraryDateFormatter.format(date);
}
