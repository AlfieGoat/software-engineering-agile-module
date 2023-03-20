export interface Argument {
  type: "Argument";
  parentType: string;
  fieldName: string;
  argumentName: string;
  fieldType: string;
}

export interface Field {
  type: "field";
  parentType: string;
  fieldName: string;
  fieldType: string;
}
