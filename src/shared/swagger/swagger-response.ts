import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiProperty,
  ApiResponse,
  getSchemaPath
} from '@nestjs/swagger';
import { getErrorMessageByCode } from '../api/api-response';

type SwaggerSchema = Record<string, unknown>;
type SwaggerModel = Type<unknown>;

export class SwaggerSuccessResponseDto {
  @ApiProperty({
    description: '业务状态码',
    example: 200
  })
  code!: number;

  @ApiProperty({
    description: '响应消息',
    example: 'success'
  })
  msg!: string;

  @ApiProperty({
    description: '响应数据',
    type: 'object',
    additionalProperties: true,
    nullable: true,
    example: null
  })
  data!: unknown;
}

export class SwaggerErrorResponseDto {
  @ApiProperty({
    description: '错误码',
    example: 1016001
  })
  code!: number;

  @ApiProperty({
    description: '错误消息',
    example: '请求参数校验失败'
  })
  msg!: string;

  @ApiProperty({
    description: '错误响应数据固定为 null',
    type: 'object',
    additionalProperties: true,
    nullable: true,
    example: null
  })
  data!: null;
}

interface ApiSuccessResponseOptions {
  type?: SwaggerModel;
  isArray?: boolean;
  description?: string;
  dataExample: unknown;
  dataSchema?: SwaggerSchema;
  extraModels?: SwaggerModel[];
}

interface ApiErrorExampleOption {
  name: string;
  code: number;
  summary?: string;
}

interface ApiErrorResponseOptions {
  status: number;
  description?: string;
  examples: ApiErrorExampleOption[];
}

function buildDataSchema(options: ApiSuccessResponseOptions): SwaggerSchema {
  if (options.dataSchema) {
    return options.dataSchema;
  }

  if (!options.type) {
    return {
      nullable: true,
      example: options.dataExample
    };
  }

  if (options.isArray) {
    return {
      type: 'array',
      items: {
        $ref: getSchemaPath(options.type)
      }
    };
  }

  return {
    $ref: getSchemaPath(options.type)
  };
}

export function ApiSuccessResponse(options: ApiSuccessResponseOptions) {
  const models = [SwaggerSuccessResponseDto, ...(options.extraModels ?? [])];

  if (options.type) {
    models.push(options.type);
  }

  const dataSchema = buildDataSchema(options);

  return applyDecorators(
    ApiExtraModels(...models),
    ApiOkResponse({
      description: options.description,
      schema: {
        allOf: [
          {
            $ref: getSchemaPath(SwaggerSuccessResponseDto)
          },
          {
            type: 'object',
            properties: {
              data: dataSchema
            },
            required: ['data']
          }
        ]
      },
      content: {
        'application/json': {
          example: {
            code: 200,
            msg: 'success',
            data: options.dataExample
          }
        }
      }
    })
  );
}

export function ApiErrorResponse(options: ApiErrorResponseOptions) {
  const examples = Object.fromEntries(
    options.examples.map((example) => [
      example.name,
      {
        summary: example.summary ?? getErrorMessageByCode(example.code),
        value: {
          code: example.code,
          msg: getErrorMessageByCode(example.code),
          data: null
        }
      }
    ])
  );

  return applyDecorators(
    ApiExtraModels(SwaggerErrorResponseDto),
    ApiResponse({
      status: options.status,
      description: options.description,
      content: {
        'application/json': {
          schema: {
            $ref: getSchemaPath(SwaggerErrorResponseDto)
          },
          examples
        }
      }
    })
  );
}
