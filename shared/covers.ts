export type CoverOption = {
  id: string
  image: string
  title: string
}

export const COVER_OPTIONS: CoverOption[] = Array.from({ length: 12 }, (_, index) => {
  const coverNumber = String(index + 1).padStart(2, '0')
  return {
    id: coverNumber,
    image: `/Обложка_${coverNumber}.jpeg`,
    title: `Обложка ${coverNumber}`
  }
})
