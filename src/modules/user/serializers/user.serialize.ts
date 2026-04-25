export class UserSerializer {
    static single(user: any) {
        return {
            id: user.id,
            employeeId: user.employee_id,
            name: user.name,
            email: user.email,
            photo: user.photo,
            isActive: user.is_active,
        }
    }

    static collection(users: any[]) {
        return users.map(user => this.single(user))
    }
}