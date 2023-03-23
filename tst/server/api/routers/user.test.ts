/* eslint-disable @typescript-eslint/unbound-method */
import "./__mocks__/env";

import { createTestContext, trpcRequest, type MockContext } from "./utils";

let mockCtx: MockContext;

beforeEach(() => {
  mockCtx = createTestContext();
});

describe("User Router", () => {
  describe("setUserRole", () => {
    test("should set user role", async () => {
      const newRole = "admin";

      mockCtx.session.user.id = "1234567890";

      const result = await trpcRequest(mockCtx).user.setUserRole({ newRole });

      expect(result).toEqual(newRole);
      expect(mockCtx.prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockCtx.session.user.id },
        data: { role: newRole },
      });
    });
  });
});
