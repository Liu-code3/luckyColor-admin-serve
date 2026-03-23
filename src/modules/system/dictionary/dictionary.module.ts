import { Module } from '@nestjs/common';
import { DictionaryController } from './dictionary.controller';
import { DictionaryItemsService } from './dictionary-items.service';
import { DictionaryService } from './dictionary.service';
import { DictionaryTypesController } from './dictionary-types.controller';
import { DictionaryTypesService } from './dictionary-types.service';

@Module({
  controllers: [DictionaryController, DictionaryTypesController],
  providers: [DictionaryService, DictionaryTypesService, DictionaryItemsService]
})
export class DictionaryModule {}
