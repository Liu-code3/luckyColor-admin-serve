import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query
} from '@nestjs/common';
import {
  CreateDictionaryDto,
  DictionaryPageQueryDto,
  UpdateDictionaryDto
} from './dictionary.dto';
import { DictionaryService } from './dictionary.service';

@Controller('dict')
export class DictionaryController {
  constructor(private readonly dictionaryService: DictionaryService) {}

  @Get('tree')
  tree() {
    return this.dictionaryService.getTree();
  }

  @Get('page')
  page(@Query() query: DictionaryPageQueryDto) {
    return this.dictionaryService.getPage(query);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.dictionaryService.detail(id);
  }

  @Post()
  create(@Body() dto: CreateDictionaryDto) {
    return this.dictionaryService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDictionaryDto) {
    return this.dictionaryService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.dictionaryService.remove(id);
  }
}
