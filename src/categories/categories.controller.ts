import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CategorysService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/role.guard';
import { Roles } from '../auth/role.decorator';
import { USERS_ROLE_ENUM } from '../users/users.constant';
import { ICategory } from './entity/categories.entity';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategorySwanggerRespone } from './dto/swangger/category-swangger.dto';
import {
  BadRequestDto,
  ConFlictExceptionDto,
  InternalServerErrorExceptionDto,
  UnauthorizedExceptionDto,
} from '../swangger/swangger.dto';
import { StatusRespone } from '../shared/respone.dto';
import { STATUS_ENUM } from '../shared/constants';
import { ApiCommonResponse } from '../decorators/common-response.decorator';

@ApiTags('categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(USERS_ROLE_ENUM.ADMIN)
@ApiInternalServerErrorResponse({
  type: InternalServerErrorExceptionDto,
  description: 'Server error',
})
@ApiUnauthorizedResponse({
  type: UnauthorizedExceptionDto,
  description: 'login with non-admin rights',
})
@Controller('categories')
export class CategorysController {
  constructor(private categoryService: CategorysService) {}

  // [POST] api/v1/categories
  @ApiCreatedResponse({
    type: CategorySwanggerRespone,
    description: 'Return new category',
  })
  @ApiBadRequestResponse({
    type: BadRequestDto,
    description: 'Category Name, image not empty',
  })
  @ApiConflictResponse({
    type: ConFlictExceptionDto,
    description: 'Category Name already exist',
  })
  @Post('/')
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
  ): Promise<ICategory> {
    return this.categoryService.create(createCategoryDto);
  }

  // [DELETE] api/v1/categories/:categoryId
  @ApiOkResponse({ type: StatusRespone })
  @ApiBadRequestResponse({
    type: BadRequestDto,
    description: "Can't delete category containing products",
  })
  @Delete(':categoryId')
  deleteCategory(@Param('categoryId') categoryId: string) {
    return this.categoryService.delete(categoryId);
  }

  // [GET] api/v1/categories'
  @ApiCommonResponse()
  @ApiOperation({
    operationId: 'GetCategories',
    description: 'Get list Category',
  })
  @ApiQuery({
    name: 'status',
    enum: STATUS_ENUM,
    required: false,
    example: STATUS_ENUM.ACTIVE,
  })
  @ApiQuery({ name: 'prioriry', type: Number, required: false, example: 1 })
  @ApiQuery({ name: 'page', type: Number, required: false, example: 1 })
  @ApiQuery({ name: 'perPage', type: Number, required: false, example: 25 })
  @ApiQuery({ name: 'sortBy', type: String, required: false })
  @ApiQuery({
    name: 'sortType',
    enum: ['asc', 'desc'],
    required: false,
    example: 'desc',
  })
  @Get()
  getCategories(@Query() query) {
    return this.categoryService.getList(query);
  }

  // [PATCH] api/v1/categories/categoryId'
  @ApiOkResponse({
    type: CategorySwanggerRespone,
    description: 'return category updated',
  })
  @ApiConflictResponse({
    type: ConFlictExceptionDto,
    description: 'Update category name already exist',
  })
  @Patch('/:categoryId')
  update(
    @Param('categoryId') updateCategoryId: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(updateCategoryId, updateCategoryDto);
  }
}
