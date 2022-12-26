import { BadRequestException, Injectable } from '@nestjs/common';
import { Standard } from 'src/shared/constants';
import { ItemsService } from '../items/items.service';
import { STATUS_ENUM } from './categories.constant';
import { CategoriesRepository } from './categories.repository';
import { ICategory } from './entity/categories.entity';

@Injectable()
export class CategorysService {
  constructor(
    private categoryRepository: CategoriesRepository,
    private itemService: ItemsService,
  ) {}

  // CREATE
  async create(category: ICategory): Promise<ICategory> {
    category.priority = Date.now();
    return this.categoryRepository.create(category);
  }

  // DELETE
  async delete(categoryId: string) {
    console.log(categoryId);

    const itemWiThThisCategory = await this.itemService.find({
      'category.id': categoryId,
    });

    if (itemWiThThisCategory[0]) {
      throw new BadRequestException('You cannot delete this item');
    }
    await this.categoryRepository.deleteMany({ _id: categoryId });
    return { success: true };
  }

  //
  async getList(query) {
    const { page, perPage, sortBy, sortType, status, prioriry } = query;
    const options: { [k: string]: any } = {
      sort: { [sortBy]: sortType },
      limit: perPage || Standard.PER_PAGE,
      page: page || Standard.PAGE,
    };

    const andFilter: { [k: string]: any } = [];
    if (status) {
      andFilter.push({ status });
    }
    const filters = andFilter.length > 0 ? { $and: andFilter } : {};

    const data = await this.categoryRepository.paginate(filters, options);
    if (prioriry) {
      let index = Number(prioriry);
      if (index <= 0) index = 0;
      if (index >= data.docs.length) index = data.docs.length - 1;

      return data.docs.sort((a, b) => {
        return a.priority - b.priority;
      })[0];
    }

    return data;
  }

  // GET BY ID
  getCategory(categoryName: string): Promise<ICategory> {
    return this.categoryRepository.findOne({ categoryName });
  }

  // UPDATE
  async update(
    categoryId: string,
    updateCategoryDto: ICategory,
  ): Promise<ICategory> {
    const arrUpdate = [];

    if (updateCategoryDto.priority) {
      const listCategoryActive = await this.categoryRepository.find({
        status: STATUS_ENUM.ACTIVE,
      });

      if (listCategoryActive.length <= 1) {
        throw new BadRequestException(
          'This category priority already number one',
        );
      }

      updateCategoryDto.priority = this.updatePriority(
        Number(updateCategoryDto.priority) - 1,
        listCategoryActive,
      );
    }

    // Update categoryName of collection item and collection Category
    if (updateCategoryDto.categoryName) {
      const category = await this.categoryRepository.findOne({
        _id: categoryId,
      });

      const oldCategoryName = category.categoryName;
      // const arrUpdate = [];
      const categoryUpdate = this.categoryRepository.findOneAndUpdate(
        { _id: categoryId },
        updateCategoryDto,
      );
      arrUpdate.push(categoryUpdate);

      const updateCategoryOfItem = this.itemService.updateMany(
        { 'category.name': oldCategoryName },
        { $set: { 'category.name': updateCategoryDto.categoryName } },
      );
      arrUpdate.push(updateCategoryOfItem);
    }

    return Promise.all(arrUpdate).then((value) => value[0]);
  }

  //
  updatePriority(priority: number, listCategoryActive): number {
    listCategoryActive.sort((a, b) => {
      if (a.priority < b.priority) return -1;
      return 0;
    });

    if (priority <= 0) {
      return Number(listCategoryActive[0].priority) - 1;
    }

    if (priority >= listCategoryActive.length - 1) {
      return (
        Number(listCategoryActive[listCategoryActive.length - 1].priority) + 1
      );
    }

    const prePriorityCategory = Number(
      listCategoryActive[priority - 1].priority,
    );
    const nextPriorityCategory = Number(
      listCategoryActive[priority + 1].priority,
    );

    return (prePriorityCategory + nextPriorityCategory) / 2;
  }
}
