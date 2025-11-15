/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateApiKeyDto } from '../models/CreateApiKeyDto';
import type { UpdateApiKeyDto } from '../models/UpdateApiKeyDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ApiKeysService {
    /**
     * Create a new API key
     * @param requestBody
     * @returns any API key successfully created
     * @throws ApiError
     */
    public static apiKeysControllerCreate(
        requestBody: CreateApiKeyDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api-keys',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                409: `API key for this provider already exists`,
            },
        });
    }
    /**
     * Get all API keys for current user
     * @returns any List of API keys
     * @throws ApiError
     */
    public static apiKeysControllerFindAll(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api-keys',
        });
    }
    /**
     * Get API key by ID
     * @param id
     * @returns any API key found
     * @throws ApiError
     */
    public static apiKeysControllerFindOne(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api-keys/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `API key not found`,
            },
        });
    }
    /**
     * Update API key
     * @param id
     * @param requestBody
     * @returns any API key successfully updated
     * @throws ApiError
     */
    public static apiKeysControllerUpdate(
        id: string,
        requestBody: UpdateApiKeyDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api-keys/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `API key not found`,
            },
        });
    }
    /**
     * Delete API key
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static apiKeysControllerRemove(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api-keys/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `API key not found`,
            },
        });
    }
}
