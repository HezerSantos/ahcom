type PlaceSearchResult = [number, PlaceDetail];

interface PlaceDetail {
  title: string;
  id: string;
  language: string;
  resultType: string;
  address: Address;
  position: Coordinates;
  access: Coordinates[];
  distance: number;
  categories: Category[];
  foodTypes?: Category[];
  chains?: Chain[];
  references: Reference[];
  contacts: Contact[];
  openingHours?: OpeningHours[];
  payment?: Payment;
  imageUrl: string
}

interface Address {
  label: string;
  countryCode: string;
  countryName: string;
  stateCode: string;
  state: string;
  county: string;
  city: string;
  district?: string;
  street: string;
  postalCode: string;
  houseNumber: string;
}

interface Coordinates {
  lat: number;
  lng: number;
}

interface Category {
  id: string;
  name: string;
  primary?: boolean;
}

interface Chain {
  id: string;
  name: string;
}

interface Reference {
  supplier: {
    id: string;
  };
  id: string;
}

interface Contact {
  phone?: { value: string }[];
  www?: { value: string }[];
}

interface OpeningHours {
  text: string[];
  isOpen: boolean;
  structured: StructuredTime[];
}

interface StructuredTime {
  start: string;
  duration: string;
  recurrence: string;
}

interface Payment {
  methods: PaymentMethod[];
}

interface PaymentMethod {
  id: string;
  accepted: boolean;
  currencies?: string[];
}

interface PoiResultsType {
    best: PlaceSearchResult[],
    explore: PlaceSearchResult[],
    quick: PlaceSearchResult[]
}

export default PoiResultsType