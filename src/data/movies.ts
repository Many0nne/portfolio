export interface Movie {
  id: string
  title: string
  year: number
  director: string
  rating: number
  note?: string
}

export const movies: Movie[] = [
  {
    id: 'alien-le-8eme-passager',
    title: 'Alien, le 8eme Passager',
    year: 1979,
    director: 'Ridley Scott',
    rating: 5,
    note: 'Huis clos spatial, tension parfaite.',
  },
  {
    id: 'amadeus',
    title: 'Amadeus',
    year: 1984,
    director: 'Milos Forman',
    rating: 5,
    note: 'Virtuosite, jalousie et grace absolue.',
  },
  {
    id: 'central-station',
    title: 'Central Station (Central do Brasil)',
    year: 1998,
    director: 'Walter Salles',
    rating: 5,
    note: 'Road movie sensible et bouleversant.',
  },
  {
    id: 'come-and-see',
    title: 'Come and See',
    year: 1985,
    director: 'Elem Klimov',
    rating: 5,
    note: 'Une experience de guerre radicale.',
  },
]

export const LETTERBOXD_URL = 'https://letterboxd.com/Manyonne/'
