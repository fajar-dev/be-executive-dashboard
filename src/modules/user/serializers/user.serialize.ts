export class UserSerializer {
    static single(user: any) {
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            role: user.role,
            lastLoginAt: user.lastLoginAt,
            lastLoginIp: user.lastLoginIp,
            isActive: user.isActive,
        }
    }

    static collection(users: any[]) {
        return users.map(user => this.single(user))
    }
}