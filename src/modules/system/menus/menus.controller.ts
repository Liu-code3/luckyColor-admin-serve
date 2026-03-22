import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query
} from '@nestjs/common';
import { CreateMenuDto, MenuListQueryDto, UpdateMenuDto } from './menus.dto';
import { MenusService } from './menus.service';

@Controller('menus')
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  @Get()
  list(@Query() query: MenuListQueryDto) {
    return this.menusService.list(query);
  }

  @Get('tree')
  tree() {
    return this.menusService.tree();
  }

  @Get(':id')
  detail(@Param('id', ParseIntPipe) id: number) {
    return this.menusService.detail(id);
  }

  @Post()
  create(@Body() dto: CreateMenuDto) {
    return this.menusService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMenuDto) {
    return this.menusService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.menusService.remove(id);
  }
}
