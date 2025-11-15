/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { JoinWaitlistDto } from '../models/JoinWaitlistDto';
import type { VerifyResponseDto } from '../models/VerifyResponseDto';
import type { WaitlistResponseDto } from '../models/WaitlistResponseDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class WaitlistService {
    /**
     * Join the waitlist
     * @param requestBody
     * @returns WaitlistResponseDto Verification email sent successfully
     * @throws ApiError
     */
    public static waitlistControllerJoinWaitlist(
        requestBody: JoinWaitlistDto,
    ): CancelablePromise<WaitlistResponseDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/waitlist',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid email or already on waitlist`,
            },
        });
    }
    /**
     * Verify email address
     * @param token
     * @returns VerifyResponseDto Email verified and added to waitlist
     * @throws ApiError
     */
    public static waitlistControllerVerifyEmail(
        token: string,
    ): CancelablePromise<VerifyResponseDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/waitlist/verify/{token}',
            path: {
                'token': token,
            },
            errors: {
                404: `Invalid or expired verification token`,
            },
        });
    }
}
