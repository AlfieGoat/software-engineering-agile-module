import { DocumentNode } from "graphql";
import {
  ArgumentPathNodes,
  ValidPathNode,
} from "../collectLeafPaths/getPathsToLeaves";
import { getArgumentAllowListInfo } from "./getArgumentAllowListInfo";
import { getFieldAllowListInfo } from "./getFieldAllowListInfo";
import { Argument, Field } from "./types";

export function produceAllowList(
  schema: DocumentNode,
  usedFields: ValidPathNode[][]
) {
  const fieldAllowList: Record<string, Field[]> = {};

  const argumentAllowList: Record<string, Argument[]> = {};

  function isArgument(field: ValidPathNode[]): field is ArgumentPathNodes[] {
    return field.some((ancestor) => ancestor.kind === "Argument");
  }

  usedFields.forEach((field) => {
    if (isArgument(field)) {
      const allowListInfo = getArgumentAllowListInfo(field, schema);
      if (allowListInfo.type === "field") {
        if (fieldAllowList[allowListInfo.parentType]) {
          fieldAllowList[allowListInfo.parentType]?.push(allowListInfo);
        } else {
          fieldAllowList[allowListInfo.parentType] = [allowListInfo];
        }
        return;
      }
      if (argumentAllowList[allowListInfo.parentType]) {
        argumentAllowList[allowListInfo.parentType]?.push(allowListInfo);
      } else {
        argumentAllowList[allowListInfo.parentType] = [allowListInfo];
      }
    } else {
      const allowListInfo = getFieldAllowListInfo(field, schema);
      if (fieldAllowList[allowListInfo.parentType]) {
        fieldAllowList[allowListInfo.parentType]?.push(allowListInfo);
      } else {
        fieldAllowList[allowListInfo.parentType] = [allowListInfo];
      }
    }
  });

  console.log(JSON.stringify({ fieldAllowList, argumentAllowList }, null, 4));
  return [fieldAllowList, argumentAllowList];
}
