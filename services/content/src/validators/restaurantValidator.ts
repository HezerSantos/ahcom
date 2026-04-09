import { param } from "express-validator";

const isHereId = (id: string): boolean => {
  // Matches 'here:pds:place:' followed by exactly 32 alphanumeric/dash characters
  const hereIdRegex = /^here:pds:place:[a-z0-9-]{32}$/i;
  return hereIdRegex.test(id);
};

export const saveRestaurantValidator = [
    param("id")
        .notEmpty()
        .isString()
        .custom(id => {
            if (isHereId(id)) {
                return true
            }
            throw Error("INVALID HERE ID")
        })
]