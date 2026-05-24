import { Repository } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { FamilyMember } from '../entities/family-member.entity';
import { Household } from '../entities/household.entity';
import { CreateFamilyMemberDto, UpdateFamilyMemberDto } from '../dto/family-member.dto';

export class FamilyMemberService {
  private familyMemberRepository: Repository<FamilyMember>;
  private householdRepository: Repository<Household>;

  constructor() {
    this.familyMemberRepository = AppDataSource.getRepository(FamilyMember);
    this.householdRepository = AppDataSource.getRepository(Household);
  }

  async create(createFamilyMemberDto: CreateFamilyMemberDto): Promise<FamilyMember> {
    const familyMember = this.familyMemberRepository.create({
      name: createFamilyMemberDto.name,
      role: createFamilyMemberDto.role,
      household: { id: createFamilyMemberDto.householdId } as any,
    });
    const saved = await this.familyMemberRepository.save(familyMember);
    await this.syncFamilySize(createFamilyMemberDto.householdId);
    return saved;
  }

  async findAll(householdId?: string): Promise<FamilyMember[]> {
    if (householdId) {
      return await this.familyMemberRepository.find({
        where: { household: { id: householdId } },
        relations: ['household'],
      });
    }
    return await this.familyMemberRepository.find({ relations: ['household'] });
  }

  async findOne(id: string): Promise<FamilyMember | null> {
    return await this.familyMemberRepository.findOne({
      where: { id },
      relations: ['household'],
    });
  }

  async update(id: string, updateFamilyMemberDto: UpdateFamilyMemberDto): Promise<FamilyMember | null> {
    await this.familyMemberRepository.update(id, updateFamilyMemberDto);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const member = await this.findOne(id);
    await this.familyMemberRepository.delete(id);
    if (member?.household?.id) {
      await this.syncFamilySize(member.household.id);
    }
  }

  private async syncFamilySize(householdId: string): Promise<void> {
    const count = await this.familyMemberRepository.count({
      where: { household: { id: householdId } },
    });
    await this.householdRepository.update(householdId, { familySize: count });
  }
}

export const familyMemberService = new FamilyMemberService();