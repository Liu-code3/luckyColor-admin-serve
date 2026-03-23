import { Module } from '@nestjs/common';
import { DictionaryController } from './dictionary.controller';
import { DictionaryItemsService } from './dictionary-items.service';
import { DictionaryService } from './dictionary.service';
import { DictionaryTypesService } from './dictionary-types.service';

@Module({
  controllers: [DictionaryController],
  providers: [DictionaryService, DictionaryTypesService, DictionaryItemsService]
})
export class DictionaryModule {}
