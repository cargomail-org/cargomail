import URLSafeBase64 from 'urlsafe-base64'
import compose from '../compose'
import rfc5322 from '../rfc5322'
import { Buffer } from 'buffer'

const encode = compose(URLSafeBase64.encode, Buffer.from, rfc5322)

export default encode
