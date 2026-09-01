export interface Pencil {
  id: string;
  type: "pencil";

  points: {
    x: number;
    y: number;
  }[];

  strokeColor: string;
  strokeWidth: number;
}
