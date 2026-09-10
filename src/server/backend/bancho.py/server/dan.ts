import { DanProvider as Base } from '$base/server'
import { GucchoError } from '~/def/messages'
import { throwGucchoError } from '~/server/utils/error'

/**
 * bancho.py does not implement the osu!dan feature set.
 * Read-style queries that the shared UI always fires (profile
 * cleared-count, dan lists) return empty results; mutations and
 * lookups by id report FeatureNotSupported with a clean error.
 */
export class DanProvider<Id, ScoreId> extends Base<Id, ScoreId> {
  search(): Promise<any> { return Promise.resolve({ total: 0, data: [] }) }
  get(): Promise<any> { return this._unsupported() }
  delete(): Promise<void> { return this._unsupported() }
  getQualifiedScores(): Promise<any> { return this._unsupported() }
  recalcQualifiedScores(): Promise<void> { return this._unsupported() }
  runCustomDan(): Promise<any> { return this._unsupported() }
  saveComposed(): Promise<any> { return this._unsupported() }
  countUserClearedDans(): Promise<number> { return Promise.resolve(0) }
  getUserClearedDans(): Promise<any[]> { return Promise.resolve([]) }
  exportAll(): Promise<any[]> { return Promise.resolve([]) }
  searchCourses(): Promise<any> { return Promise.resolve({ total: 0, data: [] }) }
  getCourse(): Promise<any> { return this._unsupported() }
  deleteCourse(): Promise<void> { return this._unsupported() }
  createCourse(): Promise<any> { return this._unsupported() }
  updateCourse(): Promise<any> { return this._unsupported() }
  managementSearchCourses(): Promise<any> { return Promise.resolve({ total: 0, data: [] }) }

  private _unsupported(): never {
    throwGucchoError(GucchoError.FeatureNotSupported)
  }
}
