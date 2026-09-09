import Foundation

struct ProgressPayload: Encodable {
    let cardId: String
    let correct: Bool
    let responseMs: Int
}
