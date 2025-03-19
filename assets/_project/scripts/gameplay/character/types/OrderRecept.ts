import { ICharacter } from './ICharacter';


export class OrderRecept {
    name: string = "";
    time: number = 0;
    orderCharacter: ICharacter;
    recept: IOrderRecept;
    constructor(name: string, time: number) {
        this.name = name;
        this.time = time;
    }
}
export interface IOrderRecept {
    onOrderDone(): void;
    onServe(): void;
}