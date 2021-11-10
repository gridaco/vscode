export const can_have_children = (type: string) => {
  switch (type) {
    case "COMPONENT":
    case "INSTANCE":
    case "FRAME":
    case "GROUP":
      return true;
    default:
      return false;
  }
};
