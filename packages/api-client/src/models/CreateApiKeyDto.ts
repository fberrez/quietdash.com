/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateApiKeyDto = {
    /**
     * Service provider
     */
    provider: CreateApiKeyDto.provider;
    /**
     * API key for the service
     */
    apiKey: string;
};
export namespace CreateApiKeyDto {
    /**
     * Service provider
     */
    export enum provider {
        OPENWEATHERMAP = 'openweathermap',
        GOOGLE_CALENDAR = 'google_calendar',
    }
}

