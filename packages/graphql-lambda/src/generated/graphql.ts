import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  Date: Date;
};

export type Activity = {
  swimmingDistance: DistanceTotal;
  walkingRunningDistance: DistanceTotal;
};

export type DistanceDay = {
  date: Scalars['Date'];
  km: Scalars['Float'];
  m: Scalars['Int'];
};

export type DistanceMonth = {
  km: Scalars['Float'];
  m: Scalars['Int'];
  month: Scalars['Int'];
  year: Scalars['Int'];
};

export type DistanceTotal = {
  days: Array<DistanceDay>;
  km: Scalars['Float'];
  m: Scalars['Int'];
  months: Array<DistanceMonth>;
};

export type Query = {
  activity: Activity;
};


export type QueryActivityArgs = {
  endDate: Scalars['Date'];
  startDate: Scalars['Date'];
};

export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
  Activity: ResolverTypeWrapper<Activity>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>;
  Date: ResolverTypeWrapper<Scalars['Date']>;
  DistanceDay: ResolverTypeWrapper<DistanceDay>;
  DistanceMonth: ResolverTypeWrapper<DistanceMonth>;
  DistanceTotal: ResolverTypeWrapper<DistanceTotal>;
  Float: ResolverTypeWrapper<Scalars['Float']>;
  Int: ResolverTypeWrapper<Scalars['Int']>;
  Query: ResolverTypeWrapper<{}>;
  String: ResolverTypeWrapper<Scalars['String']>;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  Activity: Activity;
  Boolean: Scalars['Boolean'];
  Date: Scalars['Date'];
  DistanceDay: DistanceDay;
  DistanceMonth: DistanceMonth;
  DistanceTotal: DistanceTotal;
  Float: Scalars['Float'];
  Int: Scalars['Int'];
  Query: {};
  String: Scalars['String'];
}>;

export type ActivityResolvers<ContextType = any, ParentType extends ResolversParentTypes['Activity'] = ResolversParentTypes['Activity']> = ResolversObject<{
  swimmingDistance?: Resolver<ResolversTypes['DistanceTotal'], ParentType, ContextType>;
  walkingRunningDistance?: Resolver<ResolversTypes['DistanceTotal'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface DateScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Date'], any> {
  name: 'Date';
}

export type DistanceDayResolvers<ContextType = any, ParentType extends ResolversParentTypes['DistanceDay'] = ResolversParentTypes['DistanceDay']> = ResolversObject<{
  date?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  km?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  m?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DistanceMonthResolvers<ContextType = any, ParentType extends ResolversParentTypes['DistanceMonth'] = ResolversParentTypes['DistanceMonth']> = ResolversObject<{
  km?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  m?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  month?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  year?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DistanceTotalResolvers<ContextType = any, ParentType extends ResolversParentTypes['DistanceTotal'] = ResolversParentTypes['DistanceTotal']> = ResolversObject<{
  days?: Resolver<Array<ResolversTypes['DistanceDay']>, ParentType, ContextType>;
  km?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  m?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  months?: Resolver<Array<ResolversTypes['DistanceMonth']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  activity?: Resolver<ResolversTypes['Activity'], ParentType, ContextType, RequireFields<QueryActivityArgs, 'endDate' | 'startDate'>>;
}>;

export type Resolvers<ContextType = any> = ResolversObject<{
  Activity?: ActivityResolvers<ContextType>;
  Date?: GraphQLScalarType;
  DistanceDay?: DistanceDayResolvers<ContextType>;
  DistanceMonth?: DistanceMonthResolvers<ContextType>;
  DistanceTotal?: DistanceTotalResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
}>;

