import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingIndexes1781400000000 implements MigrationInterface {
  name = 'AddMissingIndexes1781400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "idx_refresh_tokens_user" ON "inplanner"."refresh_tokens" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_notes_created_by" ON "inplanner"."notes" ("created_by_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_tasks_project_status" ON "inplanner"."tasks" ("project_id", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_tasks_project_parent" ON "inplanner"."tasks" ("project_id", "parent_task_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "inplanner"."idx_refresh_tokens_user"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "inplanner"."idx_notes_created_by"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "inplanner"."idx_tasks_project_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "inplanner"."idx_tasks_project_parent"`);
  }
}
