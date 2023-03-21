interface CreatePopupState {
    state: "Create";
  }
  
  interface EditPopupState {
    state: "Edit";
  }
  
  interface NonePopupState {
    state: "None";
  }
  
  export type Popup = CreatePopupState | EditPopupState | NonePopupState;
  