import { makeAutoObservable } from "mobx";
import {
  type APIExpression,
  CDNRoutes,
  type ExpressionFormat,
  ExpressionType,
  ImageFormat,
  type Sizes,
  type Snowflake
} from "@mutualzz/types";
import type { AppStore } from "@stores/App.store";
import { REST } from "@stores/REST.store";
import { BitField, ExpressionFlags, expressionFlags } from "@mutualzz/bitfield";

export class Expression {
  id: Snowflake;

  type: ExpressionType;
  name: string;
  assetHash: string;
  animated: boolean;

  authorId: Snowflake;
  spaceId?: Snowflake | null;

  createdAt: Date;

  flags: BitField<ExpressionFlags>;

  constructor(
    private readonly app: AppStore,
    data: APIExpression
  ) {
    this.id = data.id;
    this.type = data.type;
    this.name = data.name;
    this.assetHash = data.assetHash;
    this.authorId = data.authorId;
    this.spaceId = data.spaceId;
    this.animated = data.animated;
    this.createdAt = new Date(data.createdAt);
    this.flags = BitField.fromString(expressionFlags, data.flags.toString());

    makeAutoObservable(this, {}, { autoBind: true });
  }

  get space() {
    if (!this.spaceId) return null;
    return this.app.spaces.get(this.spaceId);
  }

  get author() {
    return this.app.users.get(this.authorId);
  }

  get url() {
    return Expression.constructUrl(this.id, this.animated, this.assetHash);
  }

  static constructUrl(
    expressionId: Snowflake,
    animated = false,
    hash: string,
    size: Sizes = 128,
    format: ExpressionFormat = ImageFormat.WebP
  ) {
    return REST.makeCDNUrl(
      CDNRoutes.expression(expressionId, hash, format, size, animated)
    );
  }

  update(data: APIExpression) {
    this.id = data.id;
    this.type = data.type;
    this.name = data.name;
    this.assetHash = data.assetHash;
    this.authorId = data.authorId;
    this.spaceId = data.spaceId;
    this.animated = data.animated;
    this.createdAt = new Date(data.createdAt);
  }

  delete() {
    return this.app.rest.delete(`/expressions/${this.id}`);
  }

  toJSON(): APIExpression {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      assetHash: this.assetHash,
      authorId: this.authorId,
      spaceId: this.spaceId,
      createdAt: this.createdAt,
      animated: this.animated,
      flags: this.flags.toBigInt()
    };
  }
}
