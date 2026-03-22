import { Prisma } from '../../../generated/prisma';
import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import { MenusService } from './menus.service';

describe('MenusService', () => {
  const createMenu = (overrides: Partial<Record<string, unknown>> = {}) => ({
    id: 301,
    parentId: null,
    title: 'Dashboard',
    name: 'DashboardView',
    type: 1,
    path: '/dashboard',
    menuKey: 'dashboard:view',
    icon: '',
    layout: '',
    isVisible: true,
    component: 'dashboard/index',
    redirect: null,
    meta: null,
    sort: 301,
    createdAt: new Date('2026-03-23T02:10:00.000Z'),
    updatedAt: new Date('2026-03-23T02:10:00.000Z'),
    ...overrides
  });

  function createPrismaMock() {
    const prisma = {
      menu: {
        create: jest.fn(),
        update: jest.fn()
      },
      $transaction: jest.fn()
    };

    prisma.$transaction.mockImplementation(
      async (
        callback: (tx: typeof prisma) => Promise<unknown>,
        _options?: unknown
      ) => callback(prisma)
    );

    return prisma;
  }

  const createUniqueConstraintError = (target: string[]) =>
    new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: 'test',
      meta: { target }
    });

  it('uses created id as default sort when sort is omitted', async () => {
    const prisma = createPrismaMock();
    const service = new MenusService(prisma as never);

    prisma.menu.create.mockResolvedValue(
      createMenu({
        sort: 0
      })
    );
    prisma.menu.update.mockResolvedValue(createMenu());

    const response = await service.create({
      title: 'Dashboard',
      name: 'DashboardView',
      type: 1,
      path: '/dashboard',
      menuKey: 'dashboard:view',
      isVisible: true,
      component: 'dashboard/index'
    });

    expect(prisma.menu.create).toHaveBeenCalledWith({
      data: {
        id: undefined,
        parentId: null,
        title: 'Dashboard',
        name: 'DashboardView',
        type: 1,
        path: '/dashboard',
        menuKey: 'dashboard:view',
        icon: '',
        layout: '',
        isVisible: true,
        component: 'dashboard/index',
        redirect: null,
        meta: undefined,
        sort: 0
      }
    });
    expect(prisma.menu.update).toHaveBeenCalledWith({
      where: { id: 301 },
      data: {
        sort: 301
      }
    });
    expect(response.data.id).toBe(301);
    expect(response.data.sort).toBe(301);
  });

  it('translates duplicate menu id conflicts into business errors', async () => {
    const prisma = createPrismaMock();
    const service = new MenusService(prisma as never);

    prisma.menu.create.mockRejectedValue(createUniqueConstraintError(['id']));

    await expect(
      service.create({
        id: 301,
        title: 'Dashboard',
        name: 'DashboardView',
        type: 1,
        path: '/dashboard',
        menuKey: 'dashboard:view',
        isVisible: true,
        component: 'dashboard/index'
      })
    ).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.DATA_ALREADY_EXISTS)
    );
  });
});
