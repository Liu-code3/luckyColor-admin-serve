import { Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { lastValueFrom, of } from 'rxjs';
import type { JwtPayload } from '../../iam/auth/jwt-payload.interface';
import { SystemLog } from './system-log.decorator';
import { SystemLogInterceptor } from './system-log.interceptor';

class DecoratedController {
  @SystemLog({
    module: '用户管理',
    action: '创建用户',
    targets: [{ source: 'body', key: 'username', label: 'username' }]
  })
  create() {
    return true;
  }

  @SystemLog({
    module: '系统配置',
    action: '刷新配置缓存'
  })
  refreshCache() {
    return true;
  }
}

class PlainController {
  list() {
    return true;
  }
}

describe('SystemLogInterceptor', () => {
  const payload: JwtPayload = {
    sub: 'user-1',
    tenantId: 'tenant_001',
    username: 'admin'
  };

  function createInterceptor() {
    const systemLogsService = {
      create: jest.fn().mockResolvedValue(undefined)
    };
    const jwtService = {
      verifyAsync: jest.fn()
    };
    const tenantContext = {
      getTenantId: jest.fn().mockReturnValue(null),
      setTenant: jest.fn()
    };

    return {
      interceptor: new SystemLogInterceptor(
        new Reflector(),
        systemLogsService as never,
        jwtService as never,
        tenantContext as never
      ),
      systemLogsService,
      jwtService,
      tenantContext
    };
  }

  function createContext(
    controllerClass: new () => unknown,
    handler: Function,
    request: Record<string, unknown>
  ) {
    return {
      getType: () => 'http',
      getClass: () => controllerClass,
      getHandler: () => handler,
      switchToHttp: () => ({
        getRequest: () => request
      })
    } as never;
  }

  it('creates a system log from request.user after a successful response', async () => {
    const { interceptor, systemLogsService } = createInterceptor();
    const controller = new DecoratedController();
    const request = {
      user: payload,
      body: {
        username: 'alice'
      },
      headers: {
        'user-agent': 'Mozilla/5.0'
      }
    };

    const result = await lastValueFrom(
      interceptor.intercept(
        createContext(DecoratedController, controller.create, request),
        {
          handle: () => of({ ok: true })
        }
      )
    );

    expect(result).toEqual({ ok: true });
    expect(systemLogsService.create).toHaveBeenCalledWith(
      payload,
      {
        module: '用户管理',
        content: '创建用户: username=alice'
      },
      request
    );
  });

  it('falls back to bearer token verification and hydrates tenant context', async () => {
    const { interceptor, systemLogsService, jwtService, tenantContext } =
      createInterceptor();
    const controller = new DecoratedController();
    const request = {
      headers: {
        authorization: 'Bearer signed-token'
      }
    };

    jwtService.verifyAsync.mockResolvedValue(payload);

    const result = await lastValueFrom(
      interceptor.intercept(
        createContext(
          DecoratedController,
          controller.refreshCache,
          request
        ),
        {
          handle: () => of(true)
        }
      )
    );

    expect(result).toBe(true);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('signed-token');
    expect(tenantContext.setTenant).toHaveBeenCalledWith(
      'tenant_001',
      'token'
    );
    expect(systemLogsService.create).toHaveBeenCalledWith(
      payload,
      {
        module: '系统配置',
        content: '刷新配置缓存'
      },
      request
    );
  });

  it('does not log undecorated handlers and swallows logging failures', async () => {
    const { interceptor, systemLogsService } = createInterceptor();
    const decoratedController = new DecoratedController();
    const plainController = new PlainController();
    const warnSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);

    systemLogsService.create.mockRejectedValue(new Error('db unavailable'));

    const plainResult = await lastValueFrom(
      interceptor.intercept(
        createContext(PlainController, plainController.list, {}),
        {
          handle: () => of('plain')
        }
      )
    );

    const decoratedResult = await lastValueFrom(
      interceptor.intercept(
        createContext(DecoratedController, decoratedController.refreshCache, {
          user: payload
        }),
        {
          handle: () => of('decorated')
        }
      )
    );

    expect(plainResult).toBe('plain');
    expect(decoratedResult).toBe('decorated');
    expect(systemLogsService.create).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });
});
