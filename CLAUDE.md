# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
yarn build              # Build all packages
yarn lint               # Run prettier --check and tsc --noEmit on all packages
yarn fix                # Run prettier --write on all packages
yarn clean              # Clean dist directories
yarn deploy             # Deploy all CDK stacks
```

Per-package commands (run from package directory):
```bash
yarn build              # Build single package
yarn watch              # Watch mode for development
yarn codegen            # Generate GraphQL types (graphql-lambda only)
```

## Architecture

This is a Yarn workspaces monorepo using Turborepo for orchestration. It collects Apple Health data via the Health Auto Export iOS app.

### Data Flow
1. **sync-lambda**: Receives POST requests from Health Auto Export app, validates secret header against AWS Secrets Manager, writes raw JSON to S3
2. **S3 → SNS**: New S3 objects trigger SNS notifications
3. **ingestion-lambda**: Processes S3 objects (metrics or workouts), writes to DynamoDB tables
4. **graphql-lambda**: Apollo Server subgraph exposing health data via GraphQL

### Packages
- `packages/cdk` - AWS CDK infrastructure (4 stacks: Data, Sync, Ingestion, Graphql)
- `packages/sync-lambda` - API endpoint for Health Auto Export
- `packages/ingestion-lambda` - S3 event processor, writes to DynamoDB
- `packages/graphql-lambda` - Apollo Federation subgraph

### DynamoDB Tables
- **DataTable**: Stores metrics (partition: `metric`, sort: `date`)
- **WorkoutTable**: Stores workouts (partition: `type`, sort: `start`)

### GraphQL
- Schema at `packages/graphql-lambda/src/schema.graphql`
- Types generated via graphql-codegen to `src/generated/graphql.ts`
- Exposes `activity(startDate, endDate)` query with distance metrics and workouts
