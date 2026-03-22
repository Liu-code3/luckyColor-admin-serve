import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiProperty,
  getSchemaPath
} from '@nestjs/swagger';

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
    nullable: true,
    example: null
  })
  data!: unknown;
}

interface ApiSuccessResponseOptions {
  type?: SwaggerModel;
  isArray?: boolean;
  description?: string;
  dataExample: unknown;
  dataSchema?: SwaggerSchema;
  extraModels?: SwaggerModel[];
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
