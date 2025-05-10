export interface CarPayload {
    avsid: string;
    id?: string;
    car_overview: {
        price: number;
        year: number;
        mileage: number;
        pk: number;
        brand: string;
        model: string;
        variant: string;
        fuel: string;
        body: string;
        transmission: string;
        doors: string;
        seats: string;
        description: string;
    };
}
  