import { Module } from '@nestjs/common';
import { DictionaryCacheService } from './dictionary-cache.service';
import { DictionaryController } from './dictionary.controller';
import { DictionaryItemsController } from './dictionary-items.controller';
import { DictionaryItemsService } from './dictionary-items.service';
import { DictionaryService } from './dictionary.service';
import { DictionaryTypesController } from './dictionary-types.controller';
import { DictionaryTypesService } from './dictionary-types.service';

@Module({
  controllers: [
    DictionaryTypesController,
    DictionaryItemsController,
    DictionaryController
  ],
  providers: [
    DictionaryService,
    DictionaryTypesService,
    DictionaryItemsService,
    DictionaryCacheService
  ]
})
export class DictionaryModule {}
