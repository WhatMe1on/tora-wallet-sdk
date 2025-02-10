import {CreateMnemonic} from '../wallet/index'

describe('CreateMnemonic', () => {
    it('should return "Hello, World!"', () => {
        expect((CreateMnemonic(12, 'english')).length == 12).toBe(true);
    });
});