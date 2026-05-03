import { Repository } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { Household } from '../entities/household.entity';
import { CreateHouseholdDto, UpdateHouseholdDto } from '../dto/household.dto';

export class HouseholdService {
  private householdRepository: Repository<Household>;

  constructor() {
    this.householdRepository = AppDataSource.getRepository(Household);
  }

  async create(createHouseholdDto: CreateHouseholdDto): Promise<Household> {
    const household = this.householdRepository.create({
      name: createHouseholdDto.name,
      familySize: createHouseholdDto.familySize,
    });
    return await this.householdRepository.save(household);
  }

  async findAll(): Promise<Household[]> {
    return await this.householdRepository.find();
  }

  async findOne(id: string): Promise<Household | null> {
    return await this.householdRepository.findOne({ where: { id } });
  }

  async update(id: string, updateHouseholdDto: UpdateHouseholdDto): Promise<Household | null> {
    await this.householdRepository.update(id, updateHouseholdDto);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.householdRepository.delete(id);
  }
}

export const householdService = new HouseholdService();