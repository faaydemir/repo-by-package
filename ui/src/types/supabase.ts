export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      _prisma_migrations: {
        Row: {
          applied_steps_count: number
          checksum: string
          finished_at: string | null
          id: string
          logs: string | null
          migration_name: string
          rolled_back_at: string | null
          started_at: string
        }
        Insert: {
          applied_steps_count?: number
          checksum: string
          finished_at?: string | null
          id: string
          logs?: string | null
          migration_name: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Update: {
          applied_steps_count?: number
          checksum?: string
          finished_at?: string | null
          id?: string
          logs?: string | null
          migration_name?: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Relationships: []
      }
      Dependency: {
        Row: {
          id: number
          name: string
          provider: string
        }
        Insert: {
          id?: number
          name: string
          provider: string
        }
        Update: {
          id?: number
          name?: string
          provider?: string
        }
        Relationships: []
      }
      DependencyMapping: {
        Row: {
          dependencyId: number
          dependencyType: string | null
          id: number
          insertedAt: string
          repoDependencyId: number
          version: string | null
          versionOperator: string | null
          versionText: string
        }
        Insert: {
          dependencyId: number
          dependencyType?: string | null
          id?: number
          insertedAt?: string
          repoDependencyId: number
          version?: string | null
          versionOperator?: string | null
          versionText: string
        }
        Update: {
          dependencyId?: number
          dependencyType?: string | null
          id?: number
          insertedAt?: string
          repoDependencyId?: number
          version?: string | null
          versionOperator?: string | null
          versionText?: string
        }
        Relationships: [
          {
            foreignKeyName: "DependencyMapping_dependencyId_fkey"
            columns: ["dependencyId"]
            isOneToOne: false
            referencedRelation: "Dependency"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "DependencyMapping_dependencyId_fkey"
            columns: ["dependencyId"]
            isOneToOne: false
            referencedRelation: "dependency_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "DependencyMapping_dependencyId_fkey"
            columns: ["dependencyId"]
            isOneToOne: false
            referencedRelation: "repo_dependency_view"
            referencedColumns: ["dependency_id"]
          },
          {
            foreignKeyName: "DependencyMapping_repoDependencyId_fkey"
            columns: ["repoDependencyId"]
            isOneToOne: false
            referencedRelation: "repo_dependency_view"
            referencedColumns: ["repo_dependency_id"]
          },
          {
            foreignKeyName: "DependencyMapping_repoDependencyId_fkey"
            columns: ["repoDependencyId"]
            isOneToOne: false
            referencedRelation: "RepoDependency"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "DependencyMapping_repoDependencyId_fkey"
            columns: ["repoDependencyId"]
            isOneToOne: false
            referencedRelation: "repository_search_matview"
            referencedColumns: ["repositoryDependencyId"]
          },
          {
            foreignKeyName: "DependencyMapping_repoDependencyId_fkey"
            columns: ["repoDependencyId"]
            isOneToOne: false
            referencedRelation: "repository_search_view"
            referencedColumns: ["repositoryDependencyId"]
          },
        ]
      }
      Repo: {
        Row: {
          createdAt: string | null
          defaultBranch: string | null
          description: string | null
          forksCount: number | null
          fullName: string | null
          githubId: number | null
          htmlUrl: string | null
          id: number
          insertedAt: string
          language: string | null
          license: Json | null
          name: string
          openIssuesCount: number | null
          owner: string
          packageProcessedAt: string | null
          private: boolean
          processible: boolean
          pushedAt: string | null
          stargazersCount: number | null
          topics: string | null
          updatedAt: string | null
          url: string | null
          watchersCount: number | null
        }
        Insert: {
          createdAt?: string | null
          defaultBranch?: string | null
          description?: string | null
          forksCount?: number | null
          fullName?: string | null
          githubId?: number | null
          htmlUrl?: string | null
          id?: number
          insertedAt?: string
          language?: string | null
          license?: Json | null
          name: string
          openIssuesCount?: number | null
          owner: string
          packageProcessedAt?: string | null
          private?: boolean
          processible?: boolean
          pushedAt?: string | null
          stargazersCount?: number | null
          topics?: string | null
          updatedAt?: string | null
          url?: string | null
          watchersCount?: number | null
        }
        Update: {
          createdAt?: string | null
          defaultBranch?: string | null
          description?: string | null
          forksCount?: number | null
          fullName?: string | null
          githubId?: number | null
          htmlUrl?: string | null
          id?: number
          insertedAt?: string
          language?: string | null
          license?: Json | null
          name?: string
          openIssuesCount?: number | null
          owner?: string
          packageProcessedAt?: string | null
          private?: boolean
          processible?: boolean
          pushedAt?: string | null
          stargazersCount?: number | null
          topics?: string | null
          updatedAt?: string | null
          url?: string | null
          watchersCount?: number | null
        }
        Relationships: []
      }
      RepoCrawTaskRun: {
        Row: {
          error: string | null
          id: number
          isBackwardCompleted: boolean
          lastRunAt: string | null
          maxStars: number
          taskKey: string
        }
        Insert: {
          error?: string | null
          id?: number
          isBackwardCompleted?: boolean
          lastRunAt?: string | null
          maxStars: number
          taskKey: string
        }
        Update: {
          error?: string | null
          id?: number
          isBackwardCompleted?: boolean
          lastRunAt?: string | null
          maxStars?: number
          taskKey?: string
        }
        Relationships: []
      }
      RepoDependency: {
        Row: {
          commitId: string | null
          id: number
          insertedAt: string
          packageProvider: string | null
          path: string | null
          repoId: number
        }
        Insert: {
          commitId?: string | null
          id?: number
          insertedAt?: string
          packageProvider?: string | null
          path?: string | null
          repoId: number
        }
        Update: {
          commitId?: string | null
          id?: number
          insertedAt?: string
          packageProvider?: string | null
          path?: string | null
          repoId?: number
        }
        Relationships: [
          {
            foreignKeyName: "RepoDependency_repoId_fkey"
            columns: ["repoId"]
            isOneToOne: false
            referencedRelation: "Repo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "RepoDependency_repoId_fkey"
            columns: ["repoId"]
            isOneToOne: false
            referencedRelation: "repository_search_matview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "RepoDependency_repoId_fkey"
            columns: ["repoId"]
            isOneToOne: false
            referencedRelation: "repository_search_view"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      dependency_view: {
        Row: {
          id: number | null
          name: string | null
          priority: number | null
          provider: string | null
          repoCount: number | null
          tags: string[] | null
        }
        Relationships: []
      }
      repo_dependency_view: {
        Row: {
          dependency_id: number | null
          dependency_name: string | null
          provider: string | null
          repo_dependency_id: number | null
        }
        Relationships: []
      }
      repository_search_matview: {
        Row: {
          defaultBranch: string | null
          description: string | null
          fullName: string | null
          githubId: number | null
          id: number | null
          language: string | null
          name: string | null
          owner: string | null
          packageIds: number[] | null
          packageProvider: string | null
          packages: Json | null
          path: string | null
          repositoryDependencyId: number | null
          stars: number | null
          topics: string | null
          updatedAt: string | null
          url: string | null
        }
        Relationships: []
      }
      repository_search_view: {
        Row: {
          defaultBranch: string | null
          description: string | null
          fullName: string | null
          githubId: number | null
          id: number | null
          language: string | null
          name: string | null
          owner: string | null
          packageIds: number[] | null
          packageProvider: string | null
          packages: Json | null
          path: string | null
          repositoryDependencyId: number | null
          stars: number | null
          topics: string | null
          updatedAt: string | null
          url: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      count_repositories: {
        Args: {
          p_packageids: number[]
        }
        Returns: number
      }
      get_packages_by_id: {
        Args: {
          p_packageids: number[]
        }
        Returns: {
          id: number
          name: string
          provider: string
          repocount: number
          tags: string[]
          priority: number
        }[]
      }
      search_packages: {
        Args: {
          p_packageids: number[]
          p_name: string
          p_provider: string
          p_page?: number
          p_per_page?: number
        }
        Returns: {
          id: number
          name: string
          provider: string
          repocount: number
          tags: string[]
          priority: number
        }[]
      }
      search_repositories: {
        Args: {
          p_packageids: number[]
          p_sortfield: string
          p_sortdirection: string
          p_page?: number
          p_per_page?: number
        }
        Returns: {
          defaultBranch: string | null
          description: string | null
          fullName: string | null
          githubId: number | null
          id: number | null
          language: string | null
          name: string | null
          owner: string | null
          packageIds: number[] | null
          packageProvider: string | null
          packages: Json | null
          path: string | null
          repositoryDependencyId: number | null
          stars: number | null
          topics: string | null
          updatedAt: string | null
          url: string | null
        }[]
      }
      search_repositories_matview: {
        Args: {
          p_packageids: number[]
          p_sortfield: string
          p_sortdirection: string
          p_page?: number
          p_per_page?: number
        }
        Returns: unknown[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
