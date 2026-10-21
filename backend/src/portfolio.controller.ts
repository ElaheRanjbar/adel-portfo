import { sectionSchema } from './portfolio.schema';
import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AdminGuard } from './auth';
import { COLLECTIONS, PortfolioRepository, atPath } from './portfolio.repository';
import type { PortfolioData, ProjectCard } from '../../shared/portfolio.models';

@Controller()
export class PortfolioController {
  constructor(private readonly repository: PortfolioRepository) {}
  private revision(value: string | undefined): number {
    if (!value || !/^(?:\d+|"\d+")$/.test(value))
      throw new BadRequestException('Provide the current revision in the If-Match header.');
    return Number(value.replaceAll('"', ''));
  }
  private mutate(revision: string | undefined, operation: (data: PortfolioData) => void) {
    const data = this.repository.read();
    operation(data);
    return this.repository.replace(data, this.revision(revision));
  }
  @Get('portfolio') read() {
    return this.repository.snapshot();
  }
  @Put('portfolio')
  @UseGuards(AdminGuard)
  save(@Body() body: unknown, @Headers('if-match') revision?: string) {
    return this.repository.replace(body, this.revision(revision));
  }
  @Post('portfolio/reset')
  @UseGuards(AdminGuard)
  reset(@Headers('if-match') revision?: string) {
    return this.repository.replace(this.repository.defaults(), this.revision(revision));
  }

  @Get('projects') projects() {
    return this.repository.read().caseStudiesList;
  }
  @Get('projects/:id') project(@Param('id') id: string) {
    const data = this.repository.read();
    const card = data.caseStudiesList.find((project) => project.id === id);
    if (!card) throw new NotFoundException('Project not found.');
    return { ...card, detail: data.detailedCaseStudies[id] || null };
  }
  @Post('projects')
  @UseGuards(AdminGuard)
  createProject(@Body() body: any, @Headers('if-match') revision?: string) {
    return this.mutate(revision, (data) => {
      const { detail, ...card } = body;
      const id = card.id || `case-${randomUUID()}`;
      if (data.caseStudiesList.some((project) => project.id === id))
        throw new ConflictException('Project ID already exists.');
      data.caseStudiesList.push({
        title: '',
        subtitle: '',
        description: '',
        image: '',
        tags: [],
        ...card,
        id,
      });
      data.detailedCaseStudies[id] = detail || {
        title: card.title || '',
        subtitle: card.subtitle || '',
        leadSummary: card.description || '',
        heroImage: card.image || '',
        tags: card.tags || [],
        meta: [],
        sections: [],
      };
    });
  }
  @Patch('projects/:id')
  @UseGuards(AdminGuard)
  updateProject(
    @Param('id') id: string,
    @Body() body: any,
    @Headers('if-match') revision?: string,
  ) {
    return this.mutate(revision, (data) => {
      const project = data.caseStudiesList.find((item) => item.id === id);
      if (!project) throw new NotFoundException('Project not found.');
      const { detail, id: ignored, ...card } = body;
      Object.assign(project, card);
      if (detail) data.detailedCaseStudies[id] = { ...data.detailedCaseStudies[id], ...detail };
    });
  }
  @Delete('projects/:id')
  @UseGuards(AdminGuard)
  deleteProject(@Param('id') id: string, @Headers('if-match') revision?: string) {
    return this.mutate(revision, (data) => {
      if (!data.caseStudiesList.some((item) => item.id === id))
        throw new NotFoundException('Project not found.');
      data.caseStudiesList = data.caseStudiesList.filter((item) => item.id !== id);
      delete data.detailedCaseStudies[id];
      data.homeProjects = data.homeProjects.filter((item) => item.id !== id);
      for (const project of data.homeProjects)
        if (
          new URL(project.caseStudyUrl || '/', 'https://portfolio.local').searchParams.get('id') ===
          id
        )
          project.caseStudyUrl = '/projects';
      for (const detail of Object.values(data.detailedCaseStudies))
        if (
          new URL(detail.nextProject?.link || '/', 'https://portfolio.local').searchParams.get(
            'id',
          ) === id
        )
          delete detail.nextProject;
    });
  }
  @Get('projects/:id/sections') sections(@Param('id') id: string) {
    const detail = this.repository.read().detailedCaseStudies[id];
    if (!detail) throw new NotFoundException('Case study not found.');
    return detail.sections;
  }
  @Post('projects/:id/sections')
  @UseGuards(AdminGuard)
  createSection(
    @Param('id') id: string,
    @Body() body: any,
    @Headers('if-match') revision?: string,
  ) {
    return this.mutate(revision, (data) => {
      const detail = data.detailedCaseStudies[id];
      if (!detail) throw new NotFoundException('Case study not found.');
      detail.sections.push({
        title: '',
        paragraphs: [],
        subsections: [],
        ...body,
        id: body.id || `section-${randomUUID()}`,
      });
    });
  }
  @Patch('projects/:id/sections/:sectionId')
  @UseGuards(AdminGuard)
  updateSection(
    @Param('id') id: string,
    @Param('sectionId') sectionId: string,
    @Body() body: any,
    @Headers('if-match') revision?: string,
  ) {
    return this.mutate(revision, (data) => {
      const section = data.detailedCaseStudies[id]?.sections.find((item) => item.id === sectionId);
      if (!section) throw new NotFoundException('Section not found.');
      Object.assign(section, body, { id: sectionId });
    });
  }
  @Delete('projects/:id/sections/:sectionId')
  @UseGuards(AdminGuard)
  deleteSection(
    @Param('id') id: string,
    @Param('sectionId') sectionId: string,
    @Headers('if-match') revision?: string,
  ) {
    return this.mutate(revision, (data) => {
      const detail = data.detailedCaseStudies[id];
      if (!detail || !detail.sections.some((item) => item.id === sectionId))
        throw new NotFoundException('Section not found.');
      detail.sections = detail.sections.filter((item) => item.id !== sectionId);
    });
  }
  @Get('tags') tags() {
    return this.repository.read().tags;
  }
  @Post('tags')
  @UseGuards(AdminGuard)
  createTag(@Body() body: any, @Headers('if-match') revision?: string) {
    return this.mutate(revision, (data) => {
      data.tags.push({ ...body, id: body.id || `tag-${randomUUID()}` });
    });
  }
  @Patch('tags/:id')
  @UseGuards(AdminGuard)
  updateTag(@Param('id') id: string, @Body() body: any, @Headers('if-match') revision?: string) {
    return this.mutate(revision, (data) => {
      const tag = data.tags.find((item) => item.id === id);
      if (!tag) throw new NotFoundException('Tag not found.');
      Object.assign(tag, body, { id });
    });
  }
  @Delete('tags/:id')
  @UseGuards(AdminGuard)
  deleteTag(@Param('id') id: string, @Headers('if-match') revision?: string) {
    return this.mutate(revision, (data) => {
      if (!data.tags.some((tag) => tag.id === id)) throw new NotFoundException('Tag not found.');
      data.tags = data.tags.filter((tag) => tag.id !== id);
      for (const item of [
        ...data.caseStudiesList,
        ...data.homeProjects,
        ...Object.values(data.detailedCaseStudies),
        ...Object.values(data.detailedCaseStudies).flatMap((detail) =>
          detail.nextProject ? [detail.nextProject] : [],
        ),
      ])
        item.tags = item.tags.filter((tag) => tag !== id);
    });
  }
  @Get('settings/:section') settings(@Param('section') section: string) {
    if (!['header', 'hero', 'about', 'footer', 'content'].includes(section))
      throw new NotFoundException('Settings not found.');
    return (this.repository.read() as any)[section];
  }
  @Patch('settings/:section')
  @UseGuards(AdminGuard)
  updateSettings(
    @Param('section') section: string,
    @Body() body: any,
    @Headers('if-match') revision?: string,
  ) {
    this.settings(section);
    return this.mutate(revision, (data) => {
      (data as any)[section] = { ...(data as any)[section], ...body };
    });
  }
  private collection(data: PortfolioData, name: string): any[] {
    const config = COLLECTIONS[name];
    if (!config) throw new NotFoundException('Collection not found.');
    return atPath(data, config.path);
  }
  private index(items: any[], value: string): number {
    if (
      !/^\d+$/.test(value) ||
      !Number.isSafeInteger(Number(value)) ||
      Number(value) >= items.length
    )
      throw new NotFoundException('Item not found.');
    return Number(value);
  }
  @Get('collections/:name') collectionItems(@Param('name') name: string) {
    return this.collection(this.repository.read(), name);
  }
  @Post('collections/:name')
  @UseGuards(AdminGuard)
  createItem(
    @Param('name') name: string,
    @Body() body: any,
    @Headers('if-match') revision?: string,
  ) {
    return this.mutate(revision, (data) =>
      this.collection(data, name).push(COLLECTIONS[name].strings ? body.value : body),
    );
  }
  @Patch('collections/:name/:index')
  @UseGuards(AdminGuard)
  updateItem(
    @Param('name') name: string,
    @Param('index') index: string,
    @Body() body: any,
    @Headers('if-match') revision?: string,
  ) {
    return this.mutate(revision, (data) => {
      const items = this.collection(data, name);
      const i = this.index(items, index);
      items[i] = COLLECTIONS[name].strings ? body.value : { ...items[i], ...body };
    });
  }
  @Delete('collections/:name/:index')
  @UseGuards(AdminGuard)
  deleteItem(
    @Param('name') name: string,
    @Param('index') index: string,
    @Headers('if-match') revision?: string,
  ) {
    return this.mutate(revision, (data) => {
      const items = this.collection(data, name);
      items.splice(this.index(items, index), 1);
    });
  }
  @Get('home-projects') homeProjects() {
    return this.repository.read().homeProjects;
  }
  @Post('home-projects')
  @UseGuards(AdminGuard)
  createHomeProject(@Body() body: any, @Headers('if-match') revision?: string) {
    return this.mutate(revision, (data) => {
      data.homeProjects.push({
        title: '',
        subtitle: '',
        description: '',
        image: '',
        tags: [],
        ...body,
        id: body.id || `home-${randomUUID()}`,
      });
    });
  }
  @Patch('home-projects/:id')
  @UseGuards(AdminGuard)
  updateHomeProject(
    @Param('id') id: string,
    @Body() body: any,
    @Headers('if-match') revision?: string,
  ) {
    return this.mutate(revision, (data) => {
      const item = data.homeProjects.find((item) => item.id === id);
      if (!item) throw new NotFoundException('Home project not found.');
      Object.assign(item, body, { id });
    });
  }
  @Delete('home-projects/:id')
  @UseGuards(AdminGuard)
  deleteHomeProject(@Param('id') id: string, @Headers('if-match') revision?: string) {
    return this.mutate(revision, (data) => {
      if (!data.homeProjects.some((item) => item.id === id))
        throw new NotFoundException('Home project not found.');
      data.homeProjects = data.homeProjects.filter((item) => item.id !== id);
    });
  }
}
