import { Injectable } from '@nestjs/common';
//import { error } from 'console';
import * as crypto from 'crypto';

@Injectable()
export class SecurityService {
    private readonly SECRET_KEY = process.env.JWT_SECRET as string ;
    private readonly SEPARATOR = '|sig';

    generateSecureToken(guestId: string) : string {

        
        const payload = `id:${guestId}`;


        const signature = crypto
            .createHmac('sha256', this.SECRET_KEY)
            .update(payload)
            .digest('hex')

        return `${payload}${this.SEPARATOR}${signature}`;
    }

    // Vérifie si un Token de QR Code est valide et n'a pas été falsifié
    verifyToken(token: string) : { isValid: boolean; guestId?: string } {
        try {
// make sure to get assist in case of error with console.log(its helps me to detec some errors)
//console.log('--- DIAGNOSTIC SÉCURITÉ ---');
//console.log('1. Token reçu à décoder :', token);


            if (!token || !token.includes(this.SEPARATOR)) {
//console.log('❌ ÉCHEC : Le séparateur est introuvable dans le token');
                return { isValid: false };
            }

            const parts = token.split(this.SEPARATOR);
            const payload = parts[0];
            const signatureReceived = parts[1];

//console.log('3. Payload extrait :', payload);
//console.log('4. Signature reçue :', signatureReceived);
//console.log('5. Clé secrète utilisée (tronquée) :', this.SECRET_KEY ? this.SECRET_KEY.substring(0, 5) + '...' : 'UNDEFINED');

            const expectedSignature = crypto
                .createHmac('sha256', this.SECRET_KEY)
                .update(payload)
                .digest('hex');
//console.log('6. Signature attendue (calculée) :', expectedSignature);

            // Si les signatures correspondent, le token n'a pas été modifié !
            if(signatureReceived === expectedSignature) {
                // on extrait ID invité via le payload
                const idPart = payload.split('|')[0];
                const guestId = idPart.split(':')[1];
                return { isValid: true, guestId };
            } 
            else {
                //console.log('❌ ÉCHEC : Les signatures ne correspondent pas !');
                return { isValid: false };
            }
            
        } catch (error: unknown) {
//const message = error instanceof Error ? error.message : String(error);
//console.log('❌ ERREUR SYSTÈME :', message);
            return { isValid: false };
        }
    }
}
